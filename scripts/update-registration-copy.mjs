import {readFileSync,writeFileSync} from 'node:fs';
const edit=(path,changes)=>{let text=readFileSync(path,'utf8');for(const [from,to] of changes)text=text.replaceAll(from,to);writeFileSync(path,text);};
edit('src/pages/RegistrationPage.tsx',[
 ['submittedForReview','registeredWithoutAccount'],['setSubmittedForReview','setRegisteredWithoutAccount'],
 ['Submission received — awaiting staff review','Registration saved'],
 ['Keep this reference for enquiries. This receipt is not an entry pass or a confirmed event place.','Keep this registration reference for enquiries. Entry passes are issued separately.'],
 ['Your details have been submitted for college staff to review. No student portal account has been created.','Your registration details and competition choices are saved. Portal access is provided separately.'],
 ['Submit your details below for the college team to review. Keep your submission reference for enquiries. Student portal access is not included at this stage.','Register below to save your details and competition choices. Keep your registration reference for enquiries. Portal access and entry passes are provided separately.'],
 ['Awaiting Staff Review','Registration Confirmed'],['Submission received!','Registration Successfully Recorded!'],
 ['Your details are saved in CrossFire for the college team to review.','Your registration has been saved in CrossFire.'],
 ['Submission Reference','Registration Reference'],['Submission reference','Registration reference'],
 ['The college team will review your details. This receipt is not an entry pass or a confirmed event place. No student portal account has been created. Contact the organisers with your reference if you need to make a correction.','Your details and competition choices are saved. No staff approval is required to record your registration. Portal access and entry passes are provided separately. Contact the organisers with your reference if you need to make a correction.'],
 ['Submit registration for review','Register for CrossFire'],
]);
edit('src/lib/registrationRequests.ts',[["data?.status !== 'received'","data?.status !== 'registered'"]]);
edit('src/operations/OperationsDashboard.tsx',[
 ["import { RegistrationReview } from './RegistrationReview';","import { StudentRecords } from './StudentRecords';"],
 ["'Registration review'","'Student records'"],
 ["['Student registration review.', 'Review submissions and record follow-up notes before confirming participation.']","['All student records.', 'Saved registrations, student accounts, and complete Excel or PDF exports.']"],
 ['<RegistrationReview />','<StudentRecords />'],
]);
edit('src/operations/EmailSettings.tsx', [['Registration review','Student records']]);
edit('scripts/prepare-security-release.mjs',[["'20261029_live_ops_and_access.sql']","'20261029_live_ops_and_access.sql','20261029160000_direct_registration.sql']"]]);
