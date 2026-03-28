<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimentacaoEstoque extends Model
{
    protected $table = 'movimentacoes_estoque';

    protected $fillable = [
        'material_id', 'obra_id', 'usuario_id', 'tipo',
        'quantidade', 'valor_unitario', 'documento', 'observacao', 'data',
    ];

    protected function casts(): array
    {
        return [
            'data'           => 'datetime',
            'quantidade'     => 'float',
            'valor_unitario' => 'float',
        ];
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function obra()
    {
        return $this->belongsTo(Obra::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
