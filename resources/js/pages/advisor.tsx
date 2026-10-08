import { Form, Head, Link } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/lib/formatters';
import { advisor } from '@/routes';
import { show as productShow } from '@/routes/products';

type Recommendation = {
    product_id: number;
    name: string;
    reason: string;
};

type Answer =
    | {
          recommendations: Recommendation[];
          confidence: number;
          reasoning: string;
          tokens: number;
      }
    | { error: string };

export default function Advisor({
    question,
    answer,
}: {
    question: string | null;
    answer: Answer | null;
}) {
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
                    <Card>
                        <CardContent className="flex flex-col gap-4">
                            <p className="text-sm text-muted-foreground">
                                {answer.reasoning}
                            </p>
                            <ul className="flex flex-col gap-3">
                                {answer.recommendations.map(
                                    (recommendation) => (
                                        <li
                                            key={recommendation.product_id}
                                            className="rounded-md border border-border p-4"
                                        >
                                            <Link
                                                href={productShow(
                                                    recommendation.product_id,
                                                )}
                                                className="font-medium hover:underline"
                                                prefetch
                                            >
                                                {recommendation.name}
                                            </Link>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {recommendation.reason}
                                            </p>
                                        </li>
                                    ),
                                )}
                            </ul>
                            <p className="text-xs text-muted-foreground">
                                Confidence {Math.round(answer.confidence * 100)}
                                % · {formatNumber(answer.tokens)} tokens
                            </p>
                        </CardContent>
                    </Card>
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
