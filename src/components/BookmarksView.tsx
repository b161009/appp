// Giao diện hiển thị tài liệu đã lưu (bookmarks)
import React from 'react';
import { Bookmark } from 'lucide-react';
import type { User, Document } from '../types';
import { Button, Card, Badge } from './UI';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
interface BookmarksViewProps {
  user: User | null;
  documents: Document[];
  users: User[];
}

const BookmarksView: React.FC<BookmarksViewProps> = ({
  user,
  documents,
  users
}) => {
  const bookmarkedDocs = documents.filter(doc => user?.bookmarks?.includes(doc.id));

  return (
    <div className="p-5 flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex justify-between items-center text-sidebar">
        <h2 className="text-xl font-black uppercase tracking-widest">TÀI LIỆU ĐÃ LƯU</h2>
      </div>

      <Card title="Danh sách tài liệu đã lưu" className="shadow-none flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border-theme text-slate-500 font-black uppercase tracking-widest text-[10px]">
                <th className="p-3">Tên tài liệu học tập</th>
                <th className="p-3 text-center">Khối</th>
                <th className="p-3">Môn học</th>
                <th className="p-3">Phân loại</th>
                <th className="p-3 text-center">Năm học</th>
                <th className="p-3 text-center">Người đăng</th>
                <th className="p-3 text-center">Lượt xem</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookmarkedDocs.map(doc => {
                const author = users.find(u => u.id === doc.authorId);
                return (
                  <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{doc.title}</td>
                    <td className="p-3 text-center"><Badge className="bg-blue-50 text-blue-600 border border-blue-100">{doc.grade}</Badge></td>
                    <td className="p-3">{doc.subject}</td>
                    <td className="p-3"><Badge className="bg-slate-100 text-slate-600">{doc.type}</Badge></td>
                    <td className="p-3 font-mono opacity-50 text-center">{doc.year}</td>
                    <td className="p-3 text-center font-bold text-slate-600">{author?.username || 'Admin'}</td>
                    <td className="p-3 text-center font-mono text-slate-500">{doc.viewCount || 0}</td>
                    <td className="p-3 text-right">
                      {doc.fileContent ? (
                        <a
                          href={doc.fileContent}
                          download={doc.title}
                          className="text-accent cursor-pointer font-black hover:underline uppercase text-[10px] tracking-tight mr-3"
                            // Tăng viewCount khi tải
                          onClick={async () => {
                          const docRef = doc(db, "documents", doc.id);
                          await updateDoc(docRef, {
                          viewCount: increment(1)
                        });
                  }}
                          
                        >
                          Tải về máy
                        </a>
                      ) : (
                        <span className="text-slate-300 cursor-not-allowed font-black uppercase text-[10px] tracking-tight mr-3">Không có file</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {bookmarkedDocs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-bold uppercase text-[11px] tracking-widest">
                    Chưa có tài liệu nào được lưu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BookmarksView;