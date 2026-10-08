import { Form, Head, Link, usePoll } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/lib/formatters';
import { advisor } from '@/routes';
import { deepAnalysis as startDeepAnalysis } from '@/routes/advisor';
import { show as productShow } from '@/routes/products';

type Recommendation = {
    product_id: number;
    name: string;
    reason: string;
};

type Result = {
    recommendations: Recommendation[];
    confidence: number;
    reasoning: string;
    tokens: number;
    cached?: boolean;
};

type Answer = Result | { error: string };

function ResultCard({ result }: { result: Result }) {
    return (
        <Card>
            <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                    {result.reasoning}
                </p>
                <ul className="flex flex-col gap-3">
                    {result.recommendations.map((recommendation) => (
                        <li
                            key={recommendation.product_id}
                            className="rounded-md border border-border p-4"
                        >
                            <Link
                                href={productShow(recommendation.product_id)}
                                className="font-medium hover:underline"
                                prefetch
                            >
                                {recommendation.name}
                            </Link>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {recommendation.reason}
                            </p>
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                    Confidence {Math.round(result.confidence * 100)}% ·{' '}
                    {formatNumber(result.tokens)} tokens
                    {result.cached && ' · served from cache (0 new tokens)'}
                </p>
            </CardContent>
        </Card>
    );
}

export default function Advisor({
    question,
    answer,
    deepAnalysis,
    deepAnalysisPending,
}: {
    question: string | null;
    answer: Answer | null;
    deepAnalysis: Answer | null;
    deepAnalysisPending: boolean;
}) {
    const { start, stop } = usePoll(
        3000,
        { only: ['deepAnalysis', 'deepAnalysisPending'] },
        { autoStart: false },
    );

    useEffect(() => {
        if (deepAnalysisPending) {
            start();
        } else {
            stop();
        }

        return stop;
    }, [deepAnalysisPending, start, stop]);

    return (
        <>
            <Head title="Product advisor" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header className="rounded-md border border-border bg-card p-6 text-card-foreground md:p-8">
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        <Sparkles className="size-4" />
                        AI assistant
                    </p>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
                        Product advisor
                    </h1>
                    <p className="mt-2 max-w-[58ch] text-base text-pretty text-muted-foreground sm:text-sm">
                        Ask for recommendations. The advisor searches the
                        catalog with a tool and answers with structured output.
                    </p>

                    <Form
                        action={advisor()}
                        className="mt-6 flex flex-col gap-3 sm:flex-row"
                        disableWhileProcessing
                    >
                        {({ processing }) => (
                            <>
                                <Input
                                    name="question"
                                    defaultValue={question ?? ''}
                                    placeholder="e.g. Well-rated desk lamps under $100 that are in stock"
                                    aria-label="Question"
                                    maxLength={500}
                                    required
                                />
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Thinking…' : 'Ask'}
                                </Button>
                            </>
                        )}
                    </Form>
                </header>

                {answer && 'error' in answer && (
                    <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                        {answer.error}
                    </p>
                )}

                {answer && 'recommendations' in answer && (
                    <ResultCard result={answer} />
                )}

                {question && (
                    <section className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold">
                                Deep analysis
                            </h2>
                            {!deepAnalysis && (
                                <Form
                                    action={startDeepAnalysis()}
                                    transform={(data) => ({
                                        ...data,
                                        question,
                                    })}
                                    disableWhileProcessing
                                >
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={deepAnalysisPending}
                                    >
                                        {deepAnalysisPending
                                            ? 'Running on the queue…'
                                            : 'Run deep analysis'}
                                    </Button>
                                </Form>
                            )}
                        </div>
                        {deepAnalysisPending && (
                            <div className="h-24 animate-pulse rounded-md bg-muted" />
                        )}
                        {deepAnalysis && 'error' in deepAnalysis && (
                            <p className="text-sm text-destructive">
                                {deepAnalysis.error}
                            </p>
                        )}
                        {deepAnalysis && 'recommendations' in deepAnalysis && (
                            <ResultCard result={deepAnalysis} />
                        )}
                    </section>
                )}
            </div>
        </>
    );
}

Advisor.layout = {
    breadcrumbs: [
        {
            title: 'Product advisor',
            href: advisor(),
        },
    ],
};
