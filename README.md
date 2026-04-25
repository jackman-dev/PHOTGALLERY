# Photographer Gallery

관리자가 사진을 등록하면 방문자는 포토그래퍼 포트폴리오 형태의 갤러리로 사진만 볼 수 있는 간단한 웹사이트입니다.

## 실행

```bash
node server.js
```

브라우저에서 아래 주소로 접속합니다.

- 방문자 화면: http://localhost:5173
- 관리자 화면: http://localhost:5173/admin.html

## 저장 방식

- 업로드한 사진 파일은 `uploads/` 폴더에 저장됩니다.
- 사진 목록은 `data/photos.json` 파일에 저장됩니다.
- `data/`와 `uploads/`는 운영 데이터라 git에는 올리지 않습니다.

## 참고

외부 사용자가 접속하는 운영 사이트로 배포할 때는 관리자 로그인, 이미지 용량 제한, 백업 정책을 추가하는 것이 좋습니다.
