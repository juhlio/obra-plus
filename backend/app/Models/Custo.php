<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Custo extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'obra_id', 'categoria_id', 'lancado_por', 'descricao',
        'tipo', 'valor', 'data', 'nota_fiscal', 'observacao',
    ];

    protected function casts(): array
    {
        return [
            'data'  => 'date',
            'valor' => 'float',
        ];
    }

    public function obra()
    {
        return $this->belongsTo(Obra::class);
    }

    public function categoria()
    {
        return $this->belongsTo(CategoriaCusto::class);
    }

    public function lancadoPor()
    {
        return $this->belongsTo(User::class, 'lancado_por');
    }
}
