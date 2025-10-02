import { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Algo deu errado
            </h2>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Recarregar Página
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
