<?php

namespace App\Support;

use App\Models\User;

/**
 * Who is acting in the current request, captured once when first resolved.
 */
class AuditContext
{
    public function __construct(public readonly ?User $actor) {}

    public function actorEmail(): string
    {
        return $this->actor?->email ?? 'system';
    }
}
