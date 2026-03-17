<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AllergenResource;
use App\Models\Allergen;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AllergenController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return AllergenResource::collection(
            Allergen::query()->orderBy('name')->get()
        );
    }
}
