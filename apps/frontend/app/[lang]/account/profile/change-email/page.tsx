// "use client";

// import React, { useState } from "react";
// import styles from "./page.module.css";
// import { useUser } from "../../../../../hooks/useUser";
// import { Input } from "../../../../../components/Input/Input";
// import { Button } from "../../../../../components/Button/Button";
// import { useTranslations } from "next-intl";
// import { Message, MessageType } from "../../../../../components/Message/Message";
// import { useRouter } from "next/navigation";

// export default function ChangeEmail() {
//     const { user } = useUser();
//     const [msg, setMsg] = useState<{ type: MessageType; message: string } | null>(null);
//     const t = useTranslations('changeEmail');
//     const router = useRouter();
//     const [newEmail, setNewEmail] = useState(user?.email || "");

//     const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
//         e.preventDefault();
//         if (newEmail && newEmail !== user?.email) {
//             // update user email does not exist
//             const result = await updateUserEmail(newEmail);
//             if (result) {
//                 setMsg(result);
//                 router.push('/account/profile');
//             }
//         }
//     };

//     return (
//         <>
//         {msg && <Message 
//             type={msg.type} 
//             text={msg.message} 
//             onClose={() => setMsg(null)}
//         />}
//         <div className={styles.page}>
//             <div className={styles.container}>
//                 <div className={styles.profileInfo}>
//                 <h2 className={styles.title}>{t('changeEmail')}</h2>
//                         <section className={styles.section}>
//                             <div>
//                                 <Input
//                                     type="email"
//                                     value={newEmail}
//                                     placeholder={t('newEmailPlaceholder')}
//                                     onChange={(e) => setNewEmail(e.target.value)}
//                                 />
//                                 <div className={styles.modalActions}>
//                                     <Button
//                                         onClick={() => router.push('/account/profile')}
//                                         theme="secondary"
//                                     >
//                                         {t('cancel')}
//                                     </Button>
//                                     <Button
//                                         onClick={handleSubmit}
//                                         disabled={!newEmail || newEmail === user?.email}
//                                         theme="primary"
//                                     >
//                                         {t('saveChanges')}
//                                     </Button>
//                                 </div>
//                             </div>
//                         </section>
//                 </div>
//             </div>
//         </div>
//         </>
//     );
// }
