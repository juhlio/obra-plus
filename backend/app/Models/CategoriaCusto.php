<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaCusto extends Model
{
    protected $table = 'categorias_custo';

    protected $fillable = ['empresa_id', 'nome', 'cor'];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function custos()
    {
        return $this->hasMany(Custo::class, 'categoria_id');
    }
}
