-- CreateTable: Create junction table for Category <-> ContentItem many-to-many
CREATE TABLE "_CategoryToContentItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToContentItem_AB_unique" ON "_CategoryToContentItem"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToContentItem_B_index" ON "_CategoryToContentItem"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToContentItem" ADD CONSTRAINT "_CategoryToContentItem_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToContentItem" ADD CONSTRAINT "_CategoryToContentItem_B_fkey" FOREIGN KEY ("B") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
