// Public student sign-in is hidden unless the build explicitly enables it.
// Staff, judge and VIP sign-in stay public. Students with issued credentials and
// returning students use the controlled entry at #student-login.
export const STUDENT_LOGIN_VIEW = 'student-login';
export const publicStudentSignInEnabled = (flag: string | undefined) => flag === 'true';
export const PUBLIC_STUDENT_SIGNIN = publicStudentSignInEnabled(import.meta.env?.VITE_STUDENT_SIGNIN_PUBLIC);
export const isStudentLoginHash = (hash: string) => hash.replace(/^#/, '').split('?')[0] === STUDENT_LOGIN_VIEW;
