set -euo pipefail
cd out
git rm -rq --cached .
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cd ..
cp -a src/shock/. out/
touch out/.nojekyll
