<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Etapa extends Model
{
    protected $fillable = [
        'obra_id', 'responsavel_id', 'nome', 'descricao', 'status',
        'data_inicio_prevista', 'data_fim_prevista',
        'data_inicio_real', 'data_fim_real',
        'progresso', 'ordem',
    ];

    protected function casts(): array
    {
        return [
            'data_inicio_prevista' => 'date',
            'data_fim_prevista'    => 'date',
            'data_inicio_real'     => 'date',
            'data_fim_real'        => 'date',
            'progresso'            => 'integer',
            'ordem'                => 'integer',
        ];
    }

    public function obra()
    {
        return $this->belongsTo(Obra::class);
    }

    public function responsavel()
    {
        return $this->belongsTo(User::class, 'responsavel_id');
    }
}
