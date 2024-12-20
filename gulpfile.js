const gulp = require("gulp");
const copy = require("gulp-copy");

// Define a tarefa de copiar os arquivos EJS
gulp.task("copy-ejs", () => {
  return gulp.src("src/views/**/*.ejs")
    .pipe(gulp.dest("dist/views"));
});
