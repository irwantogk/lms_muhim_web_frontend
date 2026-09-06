import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SMA Muhammadiyah Imogiri — LMS</title>
        <meta
          name="description"
          content="Learning Management System SMA Muhammadiyah Imogiri: absensi, materi, tugas, nilai, dan forum kelas dalam satu platform."
        />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
});
