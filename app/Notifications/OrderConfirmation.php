<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderConfirmation extends Notification implements ShouldQueue
{
    use Queueable;

    public string $orderNumber;

    public string $status;

    /**
     * Snapshot the status now: a queued notification re-fetches models when it runs,
     * so by then the order may already have moved on (paid → shipped).
     */
    public function __construct(Order $order)
    {
        $this->orderNumber = $order->number;
        $this->status = $order->status;
        $this->afterCommit();
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Order {$this->orderNumber} is {$this->status}")
            ->line("Your order {$this->orderNumber} is now {$this->status}.")
            ->line('Thanks for shopping with us!');
    }
}
