# Photographer Gallery

GitHub Pages에서 볼 수 있는 포토그래퍼 포트폴리오 갤러리입니다. 로컬 관리자 화면에서 사진을 등록한 뒤 GitHub에 push해서 공개합니다.

## 실행

로컬 관리자 서버를 실행합니다.

```bash
node server.js
```

브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:5173/admin.html
```

사진을 등록하면 `photos/` 폴더와 `photos.json` 파일이 변경됩니다. 이후 변경사항을 커밋하고 push합니다.

```bash
git add photos photos.json
git commit -m "Add gallery photos"
git push
```

배포된 사이트는 아래 주소로 확인합니다.

```text
https://jackman-dev.github.io/PHOTGALLERY/
```

## 직접 사진 추가

관리자 화면을 쓰지 않고 직접 관리하려면 `photos/` 폴더에 사진 파일을 넣고 `photos.json`에 사진 정보를 추가하면 됩니다.

## 참고

GitHub Pages는 서버 코드를 실행하지 않기 때문에 공개 사이트에서 관리자 업로드 기능은 사용할 수 없습니다. 업로드는 로컬 서버에서만 실행하고, 공개는 git push로 반영합니다.
