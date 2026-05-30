# digitalharm-oss · top-level orchestration
#
# This Makefile delegates to per-package toolchains rather than imposing a
# single build system across the polyglot portfolio (Rust+WASM, Go, Python,
# TypeScript). Each package's own README documents its native build.

PACKAGES := hashkit hashkit-match detectkit-test csam-shield promptshield \
            hashstream trainguard cybertip-cli evidencevault c2pa-lite safemod

.PHONY: help safety-check status list test build clean

help:
	@echo "digitalharm-oss"
	@echo ""
	@echo "Targets:"
	@echo "  make safety-check  - Run the SCOPE/SAFETY pre-merge guard locally"
	@echo "  make status        - Print status of each package"
	@echo "  make list          - List all packages"
	@echo "  make test          - Run tests in every package that has them"
	@echo "  make build         - Build every package that has a build target"
	@echo "  make clean         - Remove build artifacts across all packages"
	@echo ""
	@echo "Per-package: cd packages/<name> && see its README"

list:
	@printf "%s\n" $(PACKAGES)

status:
	@for pkg in $(PACKAGES); do \
		if [ -f packages/$$pkg/STATUS ]; then \
			printf "  %-18s %s\n" "$$pkg" "$$(cat packages/$$pkg/STATUS)"; \
		else \
			printf "  %-18s (no STATUS file)\n" "$$pkg"; \
		fi; \
	done

safety-check:
	@bash scripts/safety-check.sh

# These delegate to each package's own Makefile / build tooling if present.
test:
	@for pkg in $(PACKAGES); do \
		if [ -f packages/$$pkg/Makefile ]; then \
			$(MAKE) -C packages/$$pkg test 2>/dev/null || true; \
		fi; \
	done

build:
	@for pkg in $(PACKAGES); do \
		if [ -f packages/$$pkg/Makefile ]; then \
			$(MAKE) -C packages/$$pkg build 2>/dev/null || true; \
		fi; \
	done

clean:
	@for pkg in $(PACKAGES); do \
		if [ -f packages/$$pkg/Makefile ]; then \
			$(MAKE) -C packages/$$pkg clean 2>/dev/null || true; \
		fi; \
	done
