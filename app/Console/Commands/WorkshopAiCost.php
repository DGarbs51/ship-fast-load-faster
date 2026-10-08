<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('workshop:ai-cost
    {--requests=1000 : Advisor questions per day}
    {--hit-rate=0.6 : Share of questions answered from the full-response cache (0-1)}
    {--input-tokens=3000 : Average input tokens per question, including tool results and every tool step}
    {--output-tokens=400 : Average output tokens per question}
    {--input-price=1 : Provider price in USD per million input tokens}
    {--output-price=5 : Provider price in USD per million output tokens}')]
#[Description('Project daily and monthly AI spend with and without response caching')]
class WorkshopAiCost extends Command
{
    public function handle(): int
    {
        $requests = (int) $this->option('requests');
        $hitRate = min(1, max(0, (float) $this->option('hit-rate')));
        $costPerCall = ((int) $this->option('input-tokens') * (float) $this->option('input-price')
            + (int) $this->option('output-tokens') * (float) $this->option('output-price')) / 1_000_000;

        $rows = collect([
            'No caching' => $requests,
            'Full-response cache ('.round($hitRate * 100).'% hits)' => (int) round($requests * (1 - $hitRate)),
        ])->map(fn (int $calls, string $scenario): array => [
            $scenario,
            number_format($calls),
            '$'.number_format($calls * $costPerCall, 2),
            '$'.number_format($calls * $costPerCall * 30, 2),
        ]);

        $this->table(['Scenario', 'Model calls / day', 'Cost / day', 'Cost / 30 days'], $rows->values()->all());
        $this->line('Prices are inputs, not quotes. Check your provider\'s current pricing before you rely on these numbers.');

        return self::SUCCESS;
    }
}
