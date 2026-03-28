<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Material extends Model
{
    use SoftDeletes;

    protected $table = 'materiais';

    protected $fillable = [
        'empresa_id', 'categoria_id', 'nome', 'unidade',
        'valor_unitario', 'estoque_atual', 'estoque_minimo', 'estoque_maximo',
    ];

    protected $appends = ['status_estoque'];

    protected function casts(): array
    {
        return [
            'valor_unitario'  => 'float',
            'estoque_atual'   => 'float',
            'estoque_minimo'  => 'float',
            'estoque_maximo'  => 'float',
        ];
    }

    public function getStatusEstoqueAttribute(): string
    {
        if ($this->estoque_atual <= $this->estoque_minimo) {
            return 'critico';
        }
        if ($this->estoque_atual <= $this->estoque_minimo * 1.5) {
            return 'atencao';
        }
        return 'ok';
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function categoria()
    {
        return $this->belongsTo(CategoriaMaterial::class);
    }

    public function movimentacoes()
    {
        return $this->hasMany(MovimentacaoEstoque::class);
    }
}
