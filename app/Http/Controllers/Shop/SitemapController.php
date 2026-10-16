<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $baseUrl = config('app.url', url('/'));
        $baseUrl = rtrim($baseUrl, '/');

        $staticPages = [
            ['loc' => $baseUrl.'/', 'changefreq' => 'weekly', 'priority' => '1.0', 'lastmod' => date('Y-m-d')],
            ['loc' => $baseUrl.'/shop', 'changefreq' => 'daily', 'priority' => '0.9', 'lastmod' => date('Y-m-d')],
            ['loc' => $baseUrl.'/coffee', 'changefreq' => 'monthly', 'priority' => '0.8', 'lastmod' => date('Y-m-d')],
            ['loc' => $baseUrl.'/about', 'changefreq' => 'monthly', 'priority' => '0.8', 'lastmod' => date('Y-m-d')],
            ['loc' => $baseUrl.'/contact', 'changefreq' => 'monthly', 'priority' => '0.7', 'lastmod' => date('Y-m-d')],
            ['loc' => $baseUrl.'/delivery', 'changefreq' => 'monthly', 'priority' => '0.6', 'lastmod' => date('Y-m-d')],
            ['loc' => $baseUrl.'/privacy', 'changefreq' => 'yearly', 'priority' => '0.4', 'lastmod' => date('Y-m-d')],
            ['loc' => $baseUrl.'/terms', 'changefreq' => 'yearly', 'priority' => '0.4', 'lastmod' => date('Y-m-d')],
        ];

        $products = Product::published()
            ->latest('updated_at')
            ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($staticPages as $page) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>'.htmlspecialchars($page['loc'], ENT_XML1).'</loc>'."\n";
            $xml .= '    <lastmod>'.$page['lastmod'].'</lastmod>'."\n";
            $xml .= '    <changefreq>'.$page['changefreq'].'</changefreq>'."\n";
            $xml .= '    <priority>'.$page['priority'].'</priority>'."\n";
            $xml .= "  </url>\n";
        }

        foreach ($products as $product) {
            $url = $baseUrl.'/shop/'.$product->slug;
            $lastmod = $product->updated_at ? $product->updated_at->format('Y-m-d') : date('Y-m-d');
            $xml .= "  <url>\n";
            $xml .= '    <loc>'.htmlspecialchars($url, ENT_XML1).'</loc>'."\n";
            $xml .= '    <lastmod>'.$lastmod.'</lastmod>'."\n";
            $xml .= '    <changefreq>weekly</changefreq>'."\n";
            $xml .= '    <priority>0.8</priority>'."\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
        ]);
    }
}
