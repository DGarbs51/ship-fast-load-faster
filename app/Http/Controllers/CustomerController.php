<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerController extends Controller
{
    public function index(): Response
    {
        $customers = Customer::withCount('orders')
            ->withSum('orders', 'total')
            ->withLastOrderAt()
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(function (Customer $customer): array {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'city' => $customer->city,
                    'state' => $customer->state,
                    'country' => $customer->country,
                    'order_count' => $customer->orders_count,
                    'total_spend' => (float) $customer->orders_sum_total,
                    'last_order_at' => $customer->last_order_at?->toISOString(),
                    'created_at' => $customer->created_at?->toISOString(),
                ];
            });

        return Inertia::render('customers/index', [
            'customers' => $customers,
        ]);
    }

    public function export(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $output = fopen('php://output', 'w');

            fputcsv($output, ['Name', 'Email', 'Location', 'Orders', 'Total spend']);

            $customers = Customer::withCount('orders')
                ->withSum('orders', 'total')
                ->lazy(1000);

            foreach ($customers as $customer) {
                fputcsv($output, [
                    $customer->name,
                    $customer->email,
                    trim(implode(', ', array_filter([$customer->city, $customer->state, $customer->country]))),
                    $customer->orders_count,
                    (float) $customer->orders_sum_total,
                ]);
            }

            fclose($output);
        }, 'customers.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
