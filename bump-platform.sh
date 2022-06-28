./clean-packages.sh &&
cd packages/@unchainedshop/types && npm publish && cd .. &&

cd ../logger && npm install && npm publish &&
cd ../roles && npm install && npm publish &&
cd ../utils && npm install && npm publish &&
cd ../events && meteor publish &&
cd ../mongodb && meteor publish &&
cd ../file-upload && meteor publish &&

cd ../core-worker && meteor publish &&
cd ../core-accountsjs && meteor publish &&
cd ../core-assortments && meteor publish &&
cd ../core-bookmarks && meteor publish &&
cd ../core-currencies && meteor publish &&
cd ../core-countries && meteor publish &&
cd ../core-delivery && meteor publish &&
cd ../core-files && meteor publish &&
cd ../core-languages && meteor publish &&
cd ../core-messaging && meteor publish &&
cd ../core-orders && meteor publish &&
cd ../core-payment && meteor publish &&
cd ../core-products && meteor publish &&
cd ../core-filters && meteor publish &&
cd ../core-users && meteor publish &&
cd ../core-quotations && meteor publish &&
cd ../core-enrollments && meteor publish &&
cd ../core-warehousing && meteor publish &&
cd ../core-events && meteor publish &&
cd ../core && meteor publish &&

cd ../api && meteor publish &&
cd ../platform && meteor publish
