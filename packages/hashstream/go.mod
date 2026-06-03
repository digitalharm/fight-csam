module github.com/digitalharm/fight-csam/packages/hashstream

go 1.22

// Scaffold stage. Real deps land as adapters and storage backends are
// implemented:
//   - github.com/go-chi/chi/v5 for routing (planned)
//   - go.uber.org/zap for structured logging (planned)
//   - github.com/google/uuid for snapshot IDs (planned)
// All deps will be vetted against the safety guard and the project's
// supply-chain policy before landing.
