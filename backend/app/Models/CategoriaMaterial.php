<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaMaterial extends Model
{
    protected $table = 'categorias_material';

    protected $fillable = ['empresa_id', 'nome'];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function materiais()
    {
        return $this->hasMany(Material::class, 'categoria_id');
    }
}
