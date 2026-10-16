<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class StaticPageController extends Controller
{
    public function about(): Response
    {
        return Inertia::render('shop/about');
    }

    public function coffee(): Response
    {
        return Inertia::render('shop/coffee');
    }

    public function contact(): Response
    {
        return Inertia::render('shop/contact');
    }

    public function delivery(): Response
    {
        return Inertia::render('shop/delivery');
    }

    public function privacy(): Response
    {
        return Inertia::render('shop/privacy');
    }

    public function terms(): Response
    {
        return Inertia::render('shop/terms');
    }
}
