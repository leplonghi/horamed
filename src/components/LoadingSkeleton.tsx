import { Card } from "@/components/ui/card";

export const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pt-20 p-4 sm:p-6 pb-24 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-64 skeleton rounded-lg" />
          <div className="h-5 w-48 skeleton rounded-lg" />
        </div>

        {/* Cards Skeleton */}
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 space-y-4 animate-fade-in-scale" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-6 w-48 skeleton rounded-lg" />
                <div className="h-4 w-32 skeleton rounded-lg" />
              </div>
              <div className="h-12 w-20 skeleton rounded-lg" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-32 skeleton rounded-lg" />
              <div className="h-10 w-24 skeleton rounded-lg" />
              <div className="h-10 w-20 skeleton rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <Card className="p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 skeleton rounded-lg" />
          <div className="h-4 w-32 skeleton rounded-lg" />
        </div>
        <div className="h-12 w-20 skeleton rounded-lg" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 flex-1 skeleton rounded-lg" />
        <div className="h-10 w-24 skeleton rounded-lg" />
      </div>
    </Card>
  );
};

export const ListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 animate-fade-in-scale" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 skeleton rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-full skeleton rounded-lg" />
              <div className="h-4 w-2/3 skeleton rounded-lg" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-4 animate-fade-in">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4 animate-fade-in-scale" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="space-y-2">
            <div className="h-4 w-20 skeleton rounded-lg" />
            <div className="h-8 w-16 skeleton rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
};
