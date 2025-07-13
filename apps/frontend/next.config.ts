import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
    devIndicators: false // hide next logo in the bottom left
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
