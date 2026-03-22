import React, { useState, useRef } from 'react';
import ExifReader from 'exifreader';
import { Camera, MapPin, Calendar, Info, Image as ImageIcon, Map as MapIcon, ExternalLink, Loader2, ArrowUp } from 'lucide-react';
import { ToolHeader } from '../shared/ToolHeader';
import { toolRegistry } from '../../../config/toolRegistry';
import { useDeviceContext } from '../../../context/DeviceContext';

export const ExifViewer: React.FC = () => {
    const tool = toolRegistry.find(t => t.id === 'exif')!;
    const { isMobile } = useDeviceContext();

    const [metadata, setMetadata] = useState<any>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [gpsCoords, setGpsCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const convertDMSToDD = (dms: any, ref: any) => {
        let dd = 0;

        if (typeof dms === 'number') {
            dd = dms;
        } else if (typeof dms === 'string' && !isNaN(Number(dms))) {
            dd = Number(dms);
        } else if (Array.isArray(dms)) {
            // Check if it's an array of Rationals [[num, den], [num, den], [num, den]]
            // or just simple numbers [deg, min, sec]
            const calculateValue = (val: any) => {
                if (Array.isArray(val) && val.length === 2) {
                    return val[1] !== 0 ? val[0] / val[1] : 0;
                }
                return Number(val) || 0;
            };

            const d = calculateValue(dms[0]);
            const m = calculateValue(dms[1]);
            const s = calculateValue(dms[2]);

            dd = d + m / 60 + s / 3600;
        }

        // Handle ref being string or array
        let direction = '';
        if (Array.isArray(ref)) {
            direction = ref[0]?.toString().toUpperCase() || '';
        } else if (typeof ref === 'string') {
            direction = ref.toUpperCase().charAt(0);
        }

        if (direction === 'S' || direction === 'W') {
            dd = dd * -1;
        }

        return dd;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);

            // Reset state
            setMetadata(null);
            setGpsCoords(null);
            setAddress(null);

            try {
                const tags = await ExifReader.load(file);
                setMetadata(tags);

                // Extract GPS
                const latTag = tags['GPSLatitude'];
                const latRefTag = tags['GPSLatitudeRef'];
                const lngTag = tags['GPSLongitude'];
                const lngRefTag = tags['GPSLongitudeRef'];

                console.log('Raw GPS Tags:', { latTag, latRefTag, lngTag, lngRefTag });

                if (latTag && lngTag) {
                    // Default to 'N'/'E' (positive) if ref is missing
                    const latRef = latRefTag ? latRefTag.value : '';
                    const lngRef = lngRefTag ? lngRefTag.value : '';

                    console.log('Values to convert:', { latValue: latTag.value, latRef, lngValue: lngTag.value, lngRef });

                    const lat = convertDMSToDD(latTag.value, latRef);
                    const lng = convertDMSToDD(lngTag.value, lngRef);

                    console.log('Converted:', { lat, lng });

                    // Basic sanity check for valid coordinates
                    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
                        console.log('Setting GPS coords');
                        setGpsCoords({ lat, lng });
                    } else {
                        console.warn('GPS coords invalid or zero');
                    }
                } else {
                    console.warn('Missing latTag or lngTag');
                }
            } catch (error) {
                console.error('Error parsing EXIF', error);
                setMetadata({ Error: { description: 'Could not parse metadata.' } });
            }
        }
    };

    const fetchAddress = async () => {
        if (!gpsCoords) return;

        setIsFetchingAddress(true);
        try {
            // Using OSM Nominatim API
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${gpsCoords.lat}&lon=${gpsCoords.lng}&zoom=10`
            );
            const data = await response.json();
            if (data && data.display_name) {
                // Formatting address to be shorter: City, Country
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || addr.hamlet;
                const country = addr.country;
                if (city && country) {
                    setAddress(`Near ${city}, ${country}`);
                } else {
                    setAddress(data.display_name.split(',').slice(0, 2).join(', '));
                }
            } else {
                setAddress('Address not found');
            }
        } catch (error) {
            console.error('Error fetching address', error);
            setAddress('Could not fetch address');
        } finally {
            setIsFetchingAddress(false);
        }
    };

    const openMaps = () => {
        if (!gpsCoords) return;

        const { lat, lng } = gpsCoords;
        if (isMobile) {
            // Try Geo URI first, fallback to Maps
            window.location.href = `geo:${lat},${lng}?q=${lat},${lng}`;
        } else {
            window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
        }
    };

    const renderTag = (icon: React.ElementType, label: string, value: any) => {
        if (!value) return null;
        return (
            <div className="flex items-center gap-3 p-3 bg-workspace-sidebar rounded-lg">
                <div className="p-2 bg-white rounded-full text-workspace-secondary shadow-sm">
                    {React.createElement(icon, { size: 16 })}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase text-workspace-secondary tracking-wider">{label}</div>
                    <div className="text-sm font-medium text-workspace-text truncate" title={value.description || value}>
                        {value.description || value}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-workspace-canvas">
            <ToolHeader tool={tool} />
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Col: Upload & Preview */}
                    <div className="flex flex-col gap-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-workspace-border hover:border-workspace-accent rounded-2xl p-6 flex flex-col items-center justify-center gap-4 bg-white cursor-pointer transition-colors group"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileChange}
                                accept="image/jpeg,image/tiff,image/png"
                                className="hidden"
                            />
                            <div className="contents cursor-pointer">
                                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Camera size={24} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-sm font-bold text-workspace-text">Select Image</h3>
                                    <p className="text-xs text-workspace-secondary">JPG, TIFF, PNG</p>
                                </div>
                            </div>
                        </div>

                        {preview && (
                            <img src={preview} alt="Preview" className="w-full rounded-2xl border border-workspace-border shadow-sm" />
                        )}
                    </div>

                    {/* Right Col: Metadata Grid */}
                    <div className="md:col-span-2 bg-white rounded-2xl border border-workspace-border p-6 shadow-sm min-h-[400px]">
                        {!metadata ? (
                            <div className="h-full flex flex-col items-center justify-center text-workspace-secondary opacity-50">
                                <Info size={48} />
                                <p className="mt-4 font-medium">Upload an image to view metadata</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-workspace-text border-b border-workspace-border pb-2">Image Data</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {renderTag(Camera, 'Make', metadata['Make'])}
                                    {renderTag(Camera, 'Model', metadata['Model'])}
                                    {renderTag(Calendar, 'Date Taken', metadata['DateTimeOriginal'] || metadata['DateTime'])}
                                    {renderTag(ImageIcon, 'Dimensions', metadata['Image Width'] ? `${metadata['Image Width'].value} x ${metadata['Image Height'].value}` : null)}
                                </div>

                                <h3 className="text-lg font-bold text-workspace-text border-b border-workspace-border pb-2 pt-4">Camera Settings</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {renderTag(Info, 'F-Stop', metadata['FNumber'])}
                                    {renderTag(Info, 'Exposure', metadata['ExposureTime'])}
                                    {renderTag(Info, 'ISO', metadata['ISOSpeedRatings'])}
                                    {renderTag(Info, 'Focal Length', metadata['FocalLength'])}
                                </div>

                                {(metadata['GPSLatitude'] || metadata['GPSLongitude']) && (
                                    <>
                                        <h3 className="text-lg font-bold text-workspace-text border-b border-workspace-border pb-2 pt-4">Location</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Raw Coordinates */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {renderTag(MapPin, 'Latitude', metadata['GPSLatitude'])}
                                                {renderTag(MapPin, 'Longitude', metadata['GPSLongitude'])}
                                                {renderTag(ArrowUp, 'Altitude', metadata['GPSAltitude'])}
                                            </div>

                                            {/* Interactive Location Module */}
                                            {gpsCoords && (
                                                <div className="mt-2 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white rounded-full text-blue-500 shadow-sm">
                                                            <MapIcon size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-bold uppercase text-blue-400 tracking-wider">Estimated Location</div>
                                                            {address ? (
                                                                <div className="font-bold text-workspace-text">{address}</div>
                                                            ) : (
                                                                <button
                                                                    onClick={fetchAddress}
                                                                    disabled={isFetchingAddress}
                                                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-2"
                                                                >
                                                                    {isFetchingAddress && <Loader2 size={12} className="animate-spin" />}
                                                                    {isFetchingAddress ? 'Fetching...' : 'Fetch Address'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={openMaps}
                                                        className="p-2 hover:bg-white rounded-lg transition-colors text-blue-500"
                                                        title="View on Maps"
                                                    >
                                                        <ExternalLink size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
