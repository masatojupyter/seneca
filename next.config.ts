import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  serverExternalPackages: ['xrpl', 'ws', '@xrplf/isomorphic'],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
