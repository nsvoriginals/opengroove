#!/bin/bash
# Move all shadcn components to shared package
rsync -av apps/web/app/components/ui/ packages/ui/src/components/ui/
rm -rf apps/web/app/components/ui/
echo "✅ All components moved to packages/ui!"
~~~