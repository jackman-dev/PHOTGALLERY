# Photographer Gallery

GitHub Pages에서 볼 수 있는 포토그래퍼 포트폴리오 갤러리입니다.

## 실행

브라우저에서 `index.html`을 열거나 GitHub Pages 주소로 접속합니다.

```text
https://jackman-dev.github.io/PHOTGALLERY/
```

## 사진 추가

1. `photos/` 폴더에 사진 파일을 추가합니다.
2. `photos.json`에 사진 정보를 추가합니다.

```json
[
  {
    "title": "Wedding Snapshot",
    "url": "./photos/wedding-01.jpg"
  }
]
```

## 참고

GitHub Pages는 서버 코드를 실행하지 않기 때문에 웹 관리자 업로드 기능은 사용할 수 없습니다. 관리자 화면에서 직접 사진을 업로드하려면 Render, Railway 같은 서버 배포 방식이 필요합니다.
