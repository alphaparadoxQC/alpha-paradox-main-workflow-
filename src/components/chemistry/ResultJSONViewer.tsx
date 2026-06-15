import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileJson } from 'lucide-react';

export function ResultJSONViewer({ data }: { data: any }) {
  if (!data) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border h-full flex flex-col">
      <CardHeader className="py-4 border-b border-border/50 shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileJson className="w-4 h-4 text-primary" />
          Execution Result JSON
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-[400px]">
          <pre className="p-4 text-xs font-mono text-muted-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
