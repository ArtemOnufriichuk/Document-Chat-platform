let userConfig = undefined;
try {
	userConfig = await import('./v0-user-next.config');
} catch (e) {
	// ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'drive.google.com',
				pathname: '**',
			},
		],
	},
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{
						key: 'Content-Security-Policy',
						value:
							"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://drive.google.com; connect-src 'self' https://api.anthropic.com https://drive.google.com; font-src 'self'; frame-src 'self' https://drive.google.com;",
					},
					{
						key: 'Cache-Control',
						value: 'public, max-age=3600, must-revalidate',
					},
				],
			},
		];
	},
	reactStrictMode: true,
	compress: true,
	poweredByHeader: false,
	webpack: (config) => {
		// Enable importing of PDF.js worker
		config.resolve.alias.fs = false;

		return config;
	},
	experimental: {
		webpackBuildWorker: true,
		parallelServerBuildTraces: true,
		parallelServerCompiles: true,
		optimizeCss: true,
		optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
	},
};

mergeConfig(nextConfig, userConfig);

function mergeConfig(nextConfig, userConfig) {
	if (!userConfig) {
		return;
	}

	for (const key in userConfig) {
		if (typeof nextConfig[key] === 'object' && !Array.isArray(nextConfig[key])) {
			nextConfig[key] = {
				...nextConfig[key],
				...userConfig[key],
			};
		} else {
			nextConfig[key] = userConfig[key];
		}
	}
}

export default nextConfig;
