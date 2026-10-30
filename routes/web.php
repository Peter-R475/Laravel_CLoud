<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HeadcountController;

// Public Authentication Routes
Route::get('/', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Web Pages (Protected by Auth)
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return view('Main.dashboard');
    })->name('dashboard');

    Route::get('/cam', function () {
        return view('Main.cam');
    })->name('cam');
});

Route::post('/api/log-count', [HeadcountController::class, 'log'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);