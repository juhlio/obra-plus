<?php

namespace App\Observers;

use App\Models\MovimentacaoEstoque;

class MovimentacaoEstoqueObserver
{
    public function created(MovimentacaoEstoque $movimentacao): void
    {
        $material = $movimentacao->material;

        match ($movimentacao->tipo) {
            'entrada'     => $material->increment('estoque_atual', $movimentacao->quantidade),
            'saida'       => $material->decrement('estoque_atual', $movimentacao->quantidade),
            'ajuste'      => $material->update(['estoque_atual' => $movimentacao->quantidade]),
            'transferencia' => $material->decrement('estoque_atual', $movimentacao->quantidade),
        };
    }
}
