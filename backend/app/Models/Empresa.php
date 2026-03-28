<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Empresa extends Model
{
    protected $fillable = ['nome', 'cnpj', 'logo'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function obras()
    {
        return $this->hasMany(Obra::class);
    }

    public function funcionarios()
    {
        return $this->hasMany(Funcionario::class);
    }

    public function categoriasCusto()
    {
        return $this->hasMany(CategoriaCusto::class);
    }

    public function categoriasMaterial()
    {
        return $this->hasMany(CategoriaMaterial::class);
    }

    public function materiais()
    {
        return $this->hasMany(Material::class);
    }
}
