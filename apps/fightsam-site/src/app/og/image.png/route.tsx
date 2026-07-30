import { ImageResponse } from 'next/og';
import { generate as DefaultImage } from 'fumadocs-ui/og';
import { appName } from '@/lib/shared';

export const revalidate = false;

export async function GET() {
  return new ImageResponse(
    <DefaultImage
      title="Open-source CSAM safety toolkit"
      description="Free, open-source tools to detect, report, and prevent child sexual abuse material — for any online platform."
      site={appName}
    />,
    {
      width: 1200,
      height: 630,
    },
  );
}
