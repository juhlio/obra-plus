<?php

namespace App\Http\Controllers;

use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            Material::where('empresa_id', $request->user()->empresa_id)
                ->with('categoria')->get()
        );
    }

    public function criticos(Request $request): JsonResponse
    {
        return response()->json(
            Material::where('empresa_id', $request->user()->empresa_id)
                ->whereColumn('estoque_atual', '<=', 'estoque_minimo')
                ->with('categoria')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'categoria_id'   => 'required|exists:categorias_material,id',
            'nome'           => 'required|string|max:255',
            'unidade'        => 'required|string|max:20',
            'valor_unitario' => 'nullable|numeric|min:0',
            'estoque_atual'  => 'nullable|numeric|min:0',
            'estoque_minimo' => 'nullable|numeric|min:0',
            'estoque_maximo' => 'nullable|numeric|min:0',
        ]);

        $data['empresa_id'] = $request->user()->empresa_id;

        return response()->json(Material::create($data)->load('categoria'), 201);
    }

    public function update(Request $request, Material $material): JsonResponse
    {
        abort_if($material->empresa_id !== $request->user()->empresa_id, 403);

        $data = $request->validate([
            'categoria_id'   => 'sometimes|exists:categorias_material,id',
            'nome'           => 'sometimes|string|max:255',
            'unidade'        => 'sometimes|string|max:20',
            'valor_unitario' => 'sometimes|numeric|min:0',
            'estoque_minimo' => 'sometimes|numeric|min:0',
            'estoque_maximo' => 'sometimes|numeric|min:0',
        ]);

        $material->update($data);

        return response()->json($material->fresh()->load('categoria'));
    }

    public function destroy(Request $request, Material $material): JsonResponse
    {
        abort_if($material->empresa_id !== $request->user()->empresa_id, 403);
        $material->delete();

        return response()->json(null, 204);
    }
}
