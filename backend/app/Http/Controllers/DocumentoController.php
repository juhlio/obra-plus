<?php

namespace App\Http\Controllers;

use App\Models\Documento;
use App\Models\Obra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentoController extends Controller
{
    public function index(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('view', $obra);

        $query = $obra->documentos()->with('enviadoPor:id,nome');

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('update', $obra);

        $request->validate([
            'arquivo'         => 'required|file|max:51200',
            'nome'            => 'required|string|max:255',
            'tipo'            => 'required|in:contrato,art,alvara,planta,relatorio,medicao,foto,outro',
            'data_vencimento' => 'nullable|date',
            'descricao'       => 'nullable|string',
        ]);

        $file = $request->file('arquivo');
        $path = $file->store("obras/{$obra->id}/documentos", 'public');

        $doc = $obra->documentos()->create([
            'enviado_por'     => $request->user()->id,
            'nome'            => $request->nome,
            'arquivo'         => $path,
            'mime_type'       => $file->getMimeType(),
            'tamanho'         => $file->getSize(),
            'tipo'            => $request->tipo,
            'data_vencimento' => $request->data_vencimento,
            'descricao'       => $request->descricao,
        ]);

        return response()->json($doc->load('enviadoPor:id,nome'), 201);
    }

    public function download(Request $request, Documento $documento)
    {
        $this->authorize('view', $documento->obra);

        abort_unless(Storage::disk('public')->exists($documento->arquivo), 404);

        return Storage::disk('public')->download($documento->arquivo, $documento->nome);
    }

    public function updateStatus(Request $request, Documento $documento): JsonResponse
    {
        $this->authorize('update', $documento->obra);

        $data = $request->validate([
            'status' => 'required|in:pendente,aprovado,rejeitado',
        ]);

        $documento->update($data);

        return response()->json($documento->fresh());
    }

    public function destroy(Request $request, Documento $documento): JsonResponse
    {
        $this->authorize('delete', $documento->obra);

        Storage::disk('public')->delete($documento->arquivo);
        $documento->delete();

        return response()->json(null, 204);
    }
}
