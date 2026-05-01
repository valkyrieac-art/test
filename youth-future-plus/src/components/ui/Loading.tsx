export function Loading({ message = '불러오는 중입니다.' }: { message?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-6 text-slate-600">
      {message}
    </div>
  );
}
