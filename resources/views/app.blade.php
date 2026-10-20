<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Nganzi brand fonts --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Manrope:wght@400;500;600&family=Caveat:wght@700&display=swap" rel="stylesheet">

        {{-- SEO Meta Defaults --}}
        <meta name="description" content="Discover Nganzi Coffee — single-origin Ugandan Arabica and Robusta coffee grown in the high-altitude volcanic soils of Western Uganda. Artisanal Light, Medium, Dark roasts and raw green beans.">
        <meta name="keywords" content="ugandan coffee, single origin coffee, african coffee, specialty coffee uganda, arabica coffee beans, robusta coffee, raw green coffee beans, kampala coffee roasters, buy coffee online uganda, nganzi coffee, komurubuga farm">
        <meta name="author" content="Nganzi Quality Investments Ltd">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
        <meta name="theme-color" content="#FFF8EE">
        <link rel="canonical" href="{{ url()->current() }}">

        {{-- Open Graph / Social Sharing --}}
        <meta property="og:site_name" content="Nganzi Coffee">
        <meta property="og:type" content="website">
        <meta property="og:title" content="Nganzi Coffee — Single-Origin Ugandan Coffee & Artisanal Roasts">
        <meta property="og:description" content="Discover bold, aromatic single-origin coffee from Uganda's volcanic highlands. Hand-picked at Komurubuga Farm and roasted fresh in Kampala.">
        <meta property="og:image" content="{{ asset('assets/images/coffee-bag.webp') }}">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:locale" content="en_US">

        {{-- Twitter Card --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@nganzicoffee">
        <meta name="twitter:creator" content="@nganzicoffee">
        <meta name="twitter:title" content="Nganzi Coffee — From Africa, With Aroma">
        <meta name="twitter:description" content="Discover bold, aromatic single-origin coffee from Uganda's volcanic highlands. Hand-picked at Komurubuga Farm and roasted fresh in Kampala.">
        <meta name="twitter:image" content="{{ asset('assets/images/coffee-bag.webp') }}">

        {{-- Geo Location Tags --}}
        <meta name="geo.region" content="UG">
        <meta name="geo.placename" content="Kampala">
        <meta name="geo.position" content="0.3476;32.5825">
        <meta name="ICBM" content="0.3476, 32.5825">

        {{-- Organization & WebSite JSON-LD Schema --}}
        <script type="application/ld+json">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@graph' => [
                [
                    '@type' => 'Organization',
                    '@id' => url('/#organization'),
                    'name' => 'Nganzi Coffee',
                    'legalName' => 'Nganzi Quality Investments Ltd',
                    'url' => url('/'),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => asset('assets/images/logo.svg'),
                    ],
                    'foundingDate' => '2020-12',
                    'address' => [
                        '@type' => 'PostalAddress',
                        'addressLocality' => 'Kampala',
                        'addressCountry' => 'UG',
                    ],
                    'sameAs' => [
                        'https://x.com/nganzicoffee',
                        'https://www.instagram.com/nganzicoffee/',
                        'https://www.tiktok.com/@nganzicoffee',
                        'https://www.youtube.com/@nganzicoffee',
                        'https://www.linkedin.com/company/nganzicoffee/',
                    ],
                ],
                [
                    '@type' => 'WebSite',
                    '@id' => url('/#website'),
                    'url' => url('/'),
                    'name' => 'Nganzi Coffee',
                    'publisher' => [
                        '@id' => url('/#organization'),
                    ],
                    'potentialAction' => [
                        '@type' => 'SearchAction',
                        'target' => [
                            '@type' => 'EntryPoint',
                            'urlTemplate' => url('/shop').'?search={search_term_string}',
                        ],
                        'query-input' => 'required name=search_term_string',
                    ],
                ],
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) !!}
        </script>

        {{-- Favicon --}}
        <link rel="icon" href="/images/brand/favicon-large.png" type="image/png">
        <link rel="apple-touch-icon" href="/images/brand/favicon-large.png">

        {{-- Inline: set cream background and admin dark mode immediately to prevent flash --}}
        <style>html { background-color: #FFF8EE; } html.dark { background-color: #14110F; }</style>
        @if (request()->is('admin', 'admin/*', 'settings', 'settings/*', 'dashboard'))
            <script>
                (function () {
                    const appearance = localStorage.getItem('appearance') || '{{ $appearance ?? 'system' }}';
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (appearance === 'dark' || (appearance === 'system' && prefersDark)) {
                        document.documentElement.classList.add('dark');
                        document.documentElement.style.colorScheme = 'dark';
                    }
                })();
            </script>
        @endif

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Nganzi Coffee') }}</title>
        </x-inertia::head>

        @if (config('shop.analytics.script_src') && config('shop.analytics.site_id') && ! request()->is('admin', 'admin/*', 'settings', 'settings/*'))
            <script
                defer
                data-domain="{{ config('shop.analytics.site_id') }}"
                src="{{ config('shop.analytics.script_src') }}"
            ></script>
        @endif
    </head>
    <body class="font-body antialiased">
        <x-inertia::app />
    </body>
</html>
