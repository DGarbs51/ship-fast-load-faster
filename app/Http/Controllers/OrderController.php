<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $orders = Order::latest()
            ->paginate(25)
            ->withQueryString()
            ->through(function (Order $order): array {
                $items = $order->items;

                return [
                    'id' => $order->id,
                    'number' => $order->number,
                    'customer' => $order->customer?->name,
                    'item_count' => $items->count(),
                    'total' => (float) $order->total,
                    'status' => $order->status,
                    'created_at' => $order->created_at?->toISOString(),
                ];
            });

        return Inertia::render('orders/index', [
            'orders' => $orders,
        ]);
    }

    public function show(Order $order): Response
    {
        return Inertia::render('orders/show', [
            'order' => [
                'id' => $order->id,
                'number' => $order->number,
                'status' => $order->status,
                'total' => (float) $order->total,
                'created_at' => $order->created_at?->toISOString(),
                'customer' => [
                    'id' => $order->customer?->id,
                    'name' => $order->customer?->name,
                    'email' => $order->customer?->email,
                    'city' => $order->customer?->city,
                    'state' => $order->customer?->state,
                    'country' => $order->customer?->country,
                ],
                'items' => $order->items->map(fn (OrderItem $item): array => [
                    'id' => $item->id,
                    'product_id' => $item->product?->id,
                    'product' => $item->product?->name,
                    'sku' => $item->product?->sku,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'line_total' => (float) $item->line_total,
                ])->values(),
            ],
            'statuses' => Order::STATUSES,
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
        ]);

        $previousStatus = $order->status;

        $order->update([
            'status' => $validated['status'],
        ]);

        if ($previousStatus !== $order->status && in_array($order->status, ['paid', 'shipped'], true)) {
            $this->sendOrderConfirmation($order);
        }

        return back();
    }

    private function sendOrderConfirmation(Order $order): void
    {
        $order->customer?->email;

        usleep(300000);
    }
}
