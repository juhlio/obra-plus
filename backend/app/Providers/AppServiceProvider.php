<?php

namespace App\Providers;

use App\Models\MovimentacaoEstoque;
use App\Observers\MovimentacaoEstoqueObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        MovimentacaoEstoque::observe(MovimentacaoEstoqueObserver::class);
    }
}
