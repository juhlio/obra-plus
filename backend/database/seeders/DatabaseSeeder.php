<?php

namespace Database\Seeders;

use App\Models\CategoriaCusto;
use App\Models\CategoriaMaterial;
use App\Models\Custo;
use App\Models\Empresa;
use App\Models\Etapa;
use App\Models\Funcionario;
use App\Models\Material;
use App\Models\Obra;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Empresa ────────────────────────────────────────────────────────
        $empresa = Empresa::create([
            'nome' => 'Construtora Exemplo Ltda',
            'cnpj' => '12.345.678/0001-90',
        ]);

        // ─── Usuários ────────────────────────────────────────────────────────
        $admin = User::create([
            'empresa_id' => $empresa->id,
            'nome'       => 'Carlos Rocha',
            'email'      => 'admin@obraplus.com',
            'password'   => Hash::make('password'),
            'perfil'     => 'admin',
        ]);

        $engenheira = User::create([
            'empresa_id' => $empresa->id,
            'nome'       => 'Ana Souza',
            'email'      => 'ana@obraplus.com',
            'password'   => Hash::make('password'),
            'perfil'     => 'engenheiro',
        ]);

        // ─── Categorias de Custo ─────────────────────────────────────────────
        $catCustos = collect(['Mão de obra', 'Materiais', 'Equipamentos', 'Projetos', 'Outros'])
            ->map(fn ($nome) => CategoriaCusto::create(['empresa_id' => $empresa->id, 'nome' => $nome]));

        [$catMaoObra, $catMateriais, $catEquipamentos, $catProjetos, $catOutros] = $catCustos->all();

        // ─── Categorias de Material ──────────────────────────────────────────
        $catMats = collect(['Estrutural', 'Elétrico', 'Hidráulico', 'Acabamento'])
            ->map(fn ($nome) => CategoriaMaterial::create(['empresa_id' => $empresa->id, 'nome' => $nome]));

        [$estrutural, $eletrico, $hidraulico, $acabamento] = $catMats->all();

        // ─── Materiais ───────────────────────────────────────────────────────
        $materiais = [
            [$estrutural->id, 'Aço CA-50 12mm',      'kg',  8.50,  4800, 1000, 6000],
            [$estrutural->id, 'Cimento CP-II 50kg',  'sc',  32.00,   45,  200,  500],   // crítico
            [$estrutural->id, 'Tijolo cerâmico',     'un',   0.85, 12400, 5000, 20000],
            [$eletrico->id,   'Fio elétrico 2,5mm²', 'm',    4.20,   80,  300, 1000],   // crítico
            [$eletrico->id,   'Disjuntor 20A',       'un',  18.00,   42,   20,  100],
            [$hidraulico->id, 'Tubo PVC 100mm',      'm',   12.50,   60,  150,  400],   // atenção
            [$acabamento->id, 'Argamassa AC-II',     'sc',  28.00,   30,  100,  300],   // atenção
            [$acabamento->id, 'Porcelanato 60x60',   'm²',  65.00,  320,  100,  600],
        ];

        foreach ($materiais as [$catId, $nome, $unidade, $valor, $atual, $min, $max]) {
            Material::create([
                'empresa_id'     => $empresa->id,
                'categoria_id'   => $catId,
                'nome'           => $nome,
                'unidade'        => $unidade,
                'valor_unitario' => $valor,
                'estoque_atual'  => $atual,
                'estoque_minimo' => $min,
                'estoque_maximo' => $max,
            ]);
        }

        // ─── Obras ───────────────────────────────────────────────────────────

        // Obra 1
        $obra1 = Obra::create([
            'empresa_id'      => $empresa->id,
            'responsavel_id'  => $admin->id,
            'nome'            => 'Residencial Alameda Verde',
            'endereco'        => 'Rua Alameda Verde, 200',
            'cidade'          => 'São Paulo',
            'estado'          => 'SP',
            'tipo'            => 'residencial',
            'status'          => 'em_andamento',
            'orcamento_total' => 1800000,
            'data_inicio'     => '2024-03-01',
            'data_previsao_fim' => '2025-12-31',
            'progresso'       => 68,
            'cor'             => '#1D9E75',
        ]);

        foreach ([
            ['Fundação',    'concluido',    0,  '2024-03-01', '2024-05-31', 100, 1],
            ['Estrutura',   'concluido',    0,  '2024-06-01', '2024-09-30', 100, 2],
            ['Alvenaria',   'em_andamento', 0,  '2024-10-01', '2025-03-31',  65, 3],
            ['Instalações', 'nao_iniciado', 0,  '2025-04-01', '2025-09-30',   0, 4],
            ['Acabamento',  'nao_iniciado', 0,  '2025-10-01', '2025-12-31',   0, 5],
        ] as [$nome, $status, $prog, $ini, $fim, $progresso, $ordem]) {
            Etapa::create([
                'obra_id'              => $obra1->id,
                'nome'                 => $nome,
                'status'               => $status,
                'data_inicio_prevista' => $ini,
                'data_fim_prevista'    => $fim,
                'progresso'            => $progresso,
                'ordem'                => $ordem,
            ]);
        }

        foreach ([
            [$catMaoObra->id,   'Equipe de fundação e estrutura',  'realizado', 180000, '2024-06-01'],
            [$catMateriais->id, 'Aço, cimento e agregados',        'realizado', 420000, '2024-08-15'],
            [$catMateriais->id, 'Tijolos e argamassa alvenaria',   'realizado',  95000, '2024-11-20'],
        ] as [$catId, $desc, $tipo, $valor, $data]) {
            Custo::create([
                'obra_id'      => $obra1->id,
                'categoria_id' => $catId,
                'lancado_por'  => $admin->id,
                'descricao'    => $desc,
                'tipo'         => $tipo,
                'valor'        => $valor,
                'data'         => $data,
            ]);
        }

        // Obra 2
        $obra2 = Obra::create([
            'empresa_id'       => $empresa->id,
            'responsavel_id'   => $engenheira->id,
            'nome'             => 'Galpão Industrial Norte',
            'endereco'         => 'Av. Industrial, 1500',
            'cidade'           => 'Guarulhos',
            'estado'           => 'SP',
            'tipo'             => 'industrial',
            'status'           => 'em_andamento',
            'orcamento_total'  => 900000,
            'data_inicio'      => '2024-06-01',
            'data_previsao_fim' => '2025-04-30',
            'progresso'        => 42,
            'cor'              => '#3B82F6',
        ]);

        foreach ([
            ['Terraplanagem',       'concluido',    '2024-06-01', '2024-07-31', 100, 1],
            ['Estrutura metálica',  'em_andamento', '2024-08-01', '2024-12-31',  55, 2],
            ['Cobertura',           'nao_iniciado', '2025-01-01', '2025-02-28',   0, 3],
            ['Elétrica',            'nao_iniciado', '2025-03-01', '2025-04-30',   0, 4],
        ] as [$nome, $status, $ini, $fim, $progresso, $ordem]) {
            Etapa::create([
                'obra_id'              => $obra2->id,
                'nome'                 => $nome,
                'status'               => $status,
                'data_inicio_prevista' => $ini,
                'data_fim_prevista'    => $fim,
                'progresso'            => $progresso,
                'ordem'                => $ordem,
            ]);
        }

        // Obra 3
        $obra3 = Obra::create([
            'empresa_id'       => $empresa->id,
            'responsavel_id'   => $engenheira->id,
            'nome'             => 'Reforma Comercial Centro',
            'endereco'         => 'Rua Direita, 450',
            'cidade'           => 'São Paulo',
            'estado'           => 'SP',
            'tipo'             => 'reforma',
            'status'           => 'em_andamento',
            'orcamento_total'  => 320000,
            'data_inicio'      => '2024-01-01',
            'data_previsao_fim' => '2024-08-31',
            'progresso'        => 55,
            'cor'              => '#F59E0B',
        ]);

        foreach ([
            ['Demolição',  'concluido',  '2024-01-01', '2024-02-28',  100, 1],
            ['Estrutura',  'atrasado',   '2024-03-01', '2024-05-31',   60, 2],
            ['Acabamento', 'atrasado',   '2024-06-01', '2024-08-31',   20, 3],
        ] as [$nome, $status, $ini, $fim, $progresso, $ordem]) {
            Etapa::create([
                'obra_id'              => $obra3->id,
                'nome'                 => $nome,
                'status'               => $status,
                'data_inicio_prevista' => $ini,
                'data_fim_prevista'    => $fim,
                'progresso'            => $progresso,
                'ordem'                => $ordem,
            ]);
        }

        // Custo crítico: 81% do orçamento
        Custo::create([
            'obra_id'      => $obra3->id,
            'categoria_id' => $catMaoObra->id,
            'lancado_por'  => $admin->id,
            'descricao'    => 'Equipe reforma e demolição',
            'tipo'         => 'realizado',
            'valor'        => 259200, // ~81%
            'data'         => '2024-07-01',
        ]);

        // Obra 4
        $obra4 = Obra::create([
            'empresa_id'       => $empresa->id,
            'responsavel_id'   => $admin->id,
            'nome'             => 'Condomínio Parque das Flores',
            'endereco'         => 'Rod. Campinas-Mogi, km 12',
            'cidade'           => 'Campinas',
            'estado'           => 'SP',
            'tipo'             => 'residencial',
            'status'           => 'planejamento',
            'orcamento_total'  => 2400000,
            'data_inicio'      => '2025-02-01',
            'data_previsao_fim' => '2027-03-31',
            'progresso'        => 8,
            'cor'              => '#8B5CF6',
        ]);

        // ─── Funcionários ────────────────────────────────────────────────────
        $funcionarios = [
            ['Marcos Ferreira', 'Mestre de obras',     '111.222.333-44'],
            ['Ricardo Lima',    'Eletricista',          '222.333.444-55'],
            ['João Santos',     'Pedreiro',             '333.444.555-66'],
            ['Julia Prado',     'Arquiteta',            '444.555.666-77'],
            ['Carla Mendes',    'Tec. Segurança',       '555.666.777-88'],
        ];

        $fObjs = [];
        foreach ($funcionarios as [$nome, $funcao, $cpf]) {
            $fObjs[] = Funcionario::create([
                'empresa_id' => $empresa->id,
                'nome'       => $nome,
                'funcao'     => $funcao,
                'cpf'        => $cpf,
                'ativo'      => true,
            ]);
        }

        [$marcos, $ricardo, $joao, $julia, $carla] = $fObjs;

        // Alocações
        $obra1->funcionarios()->attach($marcos->id, ['data_inicio' => '2024-03-01', 'status' => 'ativo']);
        $obra1->funcionarios()->attach($joao->id,   ['data_inicio' => '2024-03-01', 'status' => 'ativo']);
        $obra3->funcionarios()->attach($ricardo->id,['data_inicio' => '2024-01-01', 'status' => 'ativo']);
        $obra4->funcionarios()->attach($julia->id,  ['data_inicio' => '2025-02-01', 'status' => 'ativo']);

        foreach ([$obra1, $obra2, $obra3, $obra4] as $obra) {
            $obra->funcionarios()->attach($carla->id, ['data_inicio' => '2024-01-01', 'status' => 'ativo']);
        }
    }
}
