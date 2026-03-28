<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Obra extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'empresa_id', 'responsavel_id', 'nome', 'descricao',
        'endereco', 'cidade', 'estado', 'tipo', 'status',
        'area_m2', 'numero_andares', 'orcamento_total',
        'data_inicio', 'data_previsao_fim', 'data_fim_real',
        'progresso', 'cor',
    ];

    protected $appends = ['esta_atrasada', 'percentual_gasto'];

    protected function casts(): array
    {
        return [
            'data_inicio'        => 'date',
            'data_previsao_fim'  => 'date',
            'data_fim_real'      => 'date',
            'area_m2'            => 'float',
            'orcamento_total'    => 'float',
            'progresso'          => 'integer',
            'numero_andares'     => 'integer',
        ];
    }

    public function getEstaAtrasadaAttribute(): bool
    {
        if (in_array($this->status, ['concluido', 'cancelado'])) {
            return false;
        }
        return $this->data_previsao_fim !== null && $this->data_previsao_fim->isPast();
    }

    public function getPercentualGastoAttribute(): float
    {
        if (!$this->orcamento_total || $this->orcamento_total == 0) {
            return 0;
        }
        $total = $this->custos()->where('tipo', 'realizado')->sum('valor');
        return round(($total / $this->orcamento_total) * 100, 2);
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function responsavel()
    {
        return $this->belongsTo(User::class, 'responsavel_id');
    }

    public function etapas()
    {
        return $this->hasMany(Etapa::class)->orderBy('ordem');
    }

    public function custos()
    {
        return $this->hasMany(Custo::class);
    }

    public function funcionarios()
    {
        return $this->belongsToMany(Funcionario::class, 'obra_funcionario')
            ->withPivot('data_inicio', 'data_fim', 'status')
            ->withTimestamps();
    }

    public function documentos()
    {
        return $this->hasMany(Documento::class);
    }

    public function movimentacoes()
    {
        return $this->hasMany(MovimentacaoEstoque::class);
    }
}
