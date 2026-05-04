<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerController extends Controller
{
    public function index(): Response
    {
        $customers = Customer::latest()
            ->paginate(25)
            ->withQueryString()
            ->through(function (Customer $customer): array {
                $orders = $customer->orders;

                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'city' => $customer->city,
                    'state' => $customer->state,
                    'country' => $customer->country,
                    'order_count' => $orders->count(),
                    'total_spend' => (float) $orders->sum(fn (Order $order): float => (float) $order->total),
                    'created_at' => $customer->created_at?->toISOString(),
                ];
            });

        return Inertia::render('customers/index', [
            'customers' => $customers,
        ]);
    }

    public function export(): StreamedResponse
    {
        $customers = Customer::all();

        return response()->streamDownload(function () use ($customers): void {
            $output = fopen('php://output', 'w');

            fputcsv($output, ['Name', 'Email', 'Location', 'Orders', 'Total spend']);

            foreach ($customers as $customer) {
                $orders = $customer->orders;

                fputcsv($output, [
                    $customer->name,
                    $customer->email,
                    trim(implode(', ', array_filter([$customer->city, $customer->state, $customer->country]))),
                    $orders->count(),
                    $orders->sum(fn (Order $order): float => (float) $order->total),
                ]);
            }

            fclose($output);
        }, 'customers.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
