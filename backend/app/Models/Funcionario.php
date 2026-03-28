<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Funcionario extends Model
{
    use SoftDeletes;

    protected $table = 'funcionarios';

    protected $fillable = [
        'empresa_id', 'nome', 'cpf', 'email', 'telefone',
        'funcao', 'salario', 'avatar', 'ativo',
    ];

    protected function casts(): array
    {
        return [
            'salario' => 'float',
            'ativo'   => 'boolean',
        ];
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function obras()
    {
        return $this->belongsToMany(Obra::class, 'obra_funcionario')
            ->withPivot('data_inicio', 'data_fim', 'status')
            ->withTimestamps();
    }
}
