<?php

namespace App\Policies;

use App\Models\Obra;
use App\Models\User;

class ObraPolicy
{
    public function view(User $user, Obra $obra): bool
    {
        return $user->empresa_id === $obra->empresa_id;
    }

    public function update(User $user, Obra $obra): bool
    {
        return $user->empresa_id === $obra->empresa_id;
    }

    public function delete(User $user, Obra $obra): bool
    {
        return $user->empresa_id === $obra->empresa_id;
    }

    public function create(User $user): bool
    {
        return true;
    }
}
