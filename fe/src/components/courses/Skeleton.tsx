export function SkeletonCard({lines = 2}: { lines?: number }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 animate-pulse">
            <div className="w-full h-40 bg-gray-200 rounded-xl"/>
            <div className="mt-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"/>
                {Array.from({length: lines}).map((_, i) => (
                    <div key={i} className="h-3 bg-gray-200 rounded w-2/3"/>
                ))}
            </div>
        </div>
    );
}