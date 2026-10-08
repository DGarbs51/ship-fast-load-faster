<?php

namespace App\Models;

use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'email', 'phone', 'city', 'state', 'country'])]
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory;

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Add a `last_order_at` column via a correlated subquery instead of loading every order.
     *
     * @param  Builder<Customer>  $query
     */
    #[Scope]
    protected function withLastOrderAt(Builder $query): void
    {
        $query->addSelect([
            'last_order_at' => Order::select('created_at')
                ->whereColumn('customer_id', 'customers.id')
                ->latest()
                ->limit(1),
        ])->withCasts(['last_order_at' => 'datetime']);
    }

    /**
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
